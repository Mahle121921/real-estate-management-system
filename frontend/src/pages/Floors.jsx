import { useCallback, useEffect, useMemo, useState } from "react"; 
import axios from "axios"; 
import { Link, useSearchParams } from "react-router-dom"; 
import { 
    Layers,
    Plus, 
    Pencil, 
    Trash2, 
    DoorOpen, 
    Search, 
    RefreshCw, 
    X, 
    Building2, 
    Home, 
    AlertCircle, 
    ArrowLeft,
 } from "lucide-react";
 import "./Floors.css"; 
 const API_URL = "http://localhost:5000/api"; 
 const Floors = () => { 
    const [searchParams] = useSearchParams(); 
    const buildingId = searchParams.get("buildingId"); 
    const token = 
    localStorage.getItem("token") || 
    localStorage.getItem("accessToken"); 
    const currentUser = useMemo(() => {
         try {
            return JSON.parse(localStorage.getItem("user") || "null");
         } catch { 
            return null; 
        } 
    }, []); 
    const userRole = String( 
        currentUser?.role || 
        currentUser?.Role || 
        currentUser?.RoleName || 
        currentUser?.roleName || 
        "" 
    ) 
    .trim() 
    .toLowerCase();
const isAdministrator = userRole === "administrator"; 
const authConfig = useMemo( 
    () => ({ 
        headers: { 
            Authorization: `Bearer ${token}`, 
        }, 
    }), 
 [token]
); 
const [floors, setFloors] = useState([]); 
const [building, setBuilding] = useState(null); 
const [loading, setLoading] = useState(true); 
const [error, setError] = useState(""); 
const [success, setSuccess] = useState(""); 
const [searchTerm, setSearchTerm] = useState(""); 
const [showModal, setShowModal] = useState(false); 
const [editingFloor, setEditingFloor] = useState(null); 
const [floorNumber, setFloorNumber] = useState(""); 
const [saving, setSaving] = useState(false); 
const [formError, setFormError] = useState(""); 
const [deleteLoading, setDeleteLoading] = useState(null); 
// ==========================================  
// FETCH BUILDING
//  ==========================================
const fetchBuilding = useCallback(async () => { 
    if (!buildingId || !token) return; 
    try { 
        const response = await axios.get( 
            `${API_URL}/buildings/${buildingId}`, 
            authConfig 
        ); 
        setBuilding( 
            response.data?.building || 
            response.data || 
            null 
        ); 
    } catch (err) { 
        console.error("Error fetching building:", err); 
        setError( err.response?.data?.message || 
            "Failed to load building." 
        ); 
    } 
}, [authConfig, buildingId, token]); 
// ========================================== 
// FETCH FLOORS 
//========================================== 
const fetchFloors = useCallback(async () => { 
    if (!token) { 
        setError("You are not authenticated."); 
        setLoading(false); 
        return; 
    } 
    try { 
        setLoading(true); 
        setError(""); 
        const response = await axios.get(
             `${API_URL}/floors`, 
             authConfig 
            ); 
            const data = response.data; 
            const floorRows = Array.isArray(data) 
            ? data 
            : Array.isArray(data?.floors) 
                ? data.floors
                 : []; 
            if (buildingId) { 
                setFloors( 
                    floorRows.filter( 
                        (floor) => 
                            Number(floor.BuildingID) === 
                            Number(buildingId) 
                        ) 
                    ); 
                } else { 
                    setFloors(floorRows); 
                }
    } catch (err) { 
        console.error("Error fetching floors:", err); 
        setError( 
                err.response?.data?.message || 
                "Failed to load floors." 
        ); 
    } finally { 
        setLoading(false); 
    } 
}, [authConfig, buildingId, token]); 
useEffect(() => { 
    fetchFloors(); 
    if (buildingId) { 
        fetchBuilding(); 
        } 
}, [fetchFloors, fetchBuilding, buildingId]); 
// ========================================== 
// SUCCESS MESSAGE 
// ========================================== 
 useEffect(() => { 
    if (!success) return; 

    const timer = setTimeout(() => { 
        setSuccess(""); 
    }, 3500); 
    return () => clearTimeout(timer);
}, [success]);
// ==========================================
//  SEARCH 
//  ========================================== 
const filteredFloors = useMemo(() => { 
    const term = searchTerm.trim().toLowerCase(); 
    if (!term) { 
        return floors; 
    } 
    return floors.filter((floor) => 
            String(floor.FloorNumber || "") 
                .toLowerCase() 
                .includes(term) 
    ); 
}, [floors, searchTerm]); 
// ==========================================
// OPEN ADD 
// ========================================== 
const openAddModal = () => { 
    setEditingFloor(null); 
    setFloorNumber(""); 
    setFormError(""); 
    setShowModal(true); 
}; 
// ========================================== 
// OPEN EDIT 
// ========================================== 
const openEditModal = (floor) => { 
    setEditingFloor(floor); 
    setFloorNumber(String(floor.FloorNumber || "")); 
    setFormError(""); setShowModal(true); 
}; 
// ========================================== 
// CLOSE MODAL 
// ========================================== 
const closeModal = () => { 
    if (saving) return; 
    setShowModal(false); 
    setEditingFloor(null); 
    setFloorNumber(""); 
    setFormError(""); 
}; 
// ========================================== 
// SAVE FLOOR 
// ========================================== 
const handleSubmit = async (event) => { 
    event.preventDefault(); 
    setFormError(""); 
    setError(""); 
    setSuccess("");

    const number = Number(floorNumber); 
    if (!Number.isInteger(number) || number < 1) { 
        setFormError( 
            "Floor number must be a positive whole number." 
        ); 
        return; 
    } 
    if (!editingFloor && !buildingId) { 
        setFormError( 
            "A building must be selected before adding a floor."
         ); 
         return; 
    } 
    try { 
           
        setSaving(true); 
        if (editingFloor) { 
            await axios.put( 
                `${API_URL}/floors/${editingFloor.FloorID}`, 
                {
                         
                    floorNumber: number, 
                }, 
                authConfig 
            ); 

            setSuccess( 
                `Floor ${number} updated successfully.`
            ); 
        } else { 
            await axios.post( 
                `${API_URL}/floors`, 
                { 

                    buildingId: Number(buildingId), 
                    floorNumber: number, 
                }, authConfig 
            );

            setSuccess( 
                `Floor ${number} added successfully.` 
            ); 
        } 
        closeModal(); 
        await fetchFloors(); 
        await fetchBuilding(); 
    } catch (err) {
        console.error("Error saving floor:", err);

        setFormError( 
            err.response?.data?.message || 
            "Failed to save floor." 
        ); 
    } finally { 
        setSaving(false); 
    } 
}; 
// ========================================== 
// DELETE FLOOR 
//  ========================================== 
const handleDelete = async (floor) => { 
    const roomCount = Number(floor.RoomCount || 0); 
    
    let message = 
        `Are you sure you want to delete Floor ${floor.FloorNumber}?`; 
    if (roomCount > 0) { 
        message += 
        `\n\nThis floor contains ${roomCount} room(s). ` + 
        "The backend will prevent deletion until the rooms are removed."; 
    } 
    if (!window.confirm(message)) { 
        return; 
    } 
    try {
        setDeleteLoading(floor.FloorID); 
        setError(""); 
        setSuccess(""); 

        await axios.delete( 
            `${API_URL}/floors/${floor.FloorID}`, 
            authConfig 
        ); 
        setSuccess( 
                `Floor ${floor.FloorNumber} deleted successfully.` 
        );

        await fetchFloors(); 
        await fetchBuilding(); 
    } catch (err) { 
        console.error("Error deleting floor:", err); 

        setError( 
            err.response?.data?.message || 
            "Failed to delete floor." 
        ); 
    } finally { 
        setDeleteLoading(null); 
    } 
}; 
const totalRooms = floors.reduce( 
    (total, floor) => 
        total + Number(floor.RoomCount || 0), 
    0 
); 

return ( 
    <div className="floors-page"> 

        {/* ========================================== 
        HEADER ========================================== */}
        <div className="floors-header"> 
            <div className="floors-title-area"> 
                <div className="floors-title-icon"> 
                    <Layers size={26} /> 
                </div>

                <div> 
                    <h1>Floors</h1> 
                    <p> 
                        Manage floors and rooms within buildings 
                    </p> 
                </div> 

            </div> 

            {isAdministrator && buildingId && ( 
                <button 
                    type="button" 
                    className="floor-add-btn" 
                    onClick={openAddModal} 
                > 
                    <Plus size={18} /> 
                    Add Floor 
                </button> 
            )}

    </div>
{/* ========================================== 
BREADCRUMB 
========================================== */} 
<div className="floor-breadcrumb"> 
    <Link to="/properties"> 
        Properties 
    </Link> 
    <span>/</span> 
    <Link to="/buildings"> 
        Buildings 
    </Link> 
    <span>/</span> 
    <span>Floors</span> 
    
</div> {/* ========================================== 
BUILDING INFO 
========================================== */} 
{building && ( 
    <div className="floor-building-card"> 
        <div className="floor-building-icon"> 
            <Building2 size={24} /> 
        </div> 
        <div className="floor-building-info"> 
            <span>Building</span> 
            <strong> 
                {building.BuildingName} 
            </strong> 
            <small> 
                <Home size={13} /> 
                {building.PropertyName} 
            </small> 
        </div> 

        <div className="floor-building-summary"> 
            <div> 
                <strong>{floors.length}</strong> 
                <span>Floors</span> 
            </div> 
            <div> 
                <strong>{totalRooms}</strong> 
                <span>Rooms</span> 
            </div> 
        </div> 
    </div> 
)} 
{/* ========================================== 
ALERTS 
========================================== */} 
{success && ( 
    <div className="floor-alert floor-alert-success"> 
        <span className="floor-success-icon"> 
        ✓ 
        </span> 
        <span>{success}</span> 
        <button 
            type="button" 
            onClick={() => setSuccess("")} 
        > 
            <X size={16} /> 
        </button> 
    </div> 
)} 
    {error && ( 
        <div className="floor-alert floor-alert-error"> 
                <AlertCircle size={18} /> 
                <span>{error}</span> 
                <button 
                    type="button" 
                    onClick={() => setError("")} 
                > 
                    <X size={16} /> 
                </button> 
        </div> 
)} 
{/* ========================================== 
TOOLBAR 
========================================== */} 
<div className="floors-toolbar"> 
    <div className="floor-search"> 
        <Search size={18} /> 
        <input 
            type="text" 
            placeholder="Search floor number..." 
            value={searchTerm} 
            onChange={(event) => 
                setSearchTerm(event.target.value) 
            } 
        /> 
        {searchTerm && ( 
            <button 
                type="button" 
                onClick={() => setSearchTerm("")} 
            > 
                <X size={15} /> 
            </button> 
        )} 
        
    </div> 
    <button 
        type="button" 
        className="floor-refresh-btn" 
        onClick={fetchFloors} 
        disabled={loading} 
    > 
        <RefreshCw 
            size={17} 
            className={ 
                loading 
                ? "floor-spin" 
                : "" 
            } 
        />
        Refresh 
    </button> 
</div> 
{/* ========================================== 
FLOORS TABLE 
========================================== */} 
<div className="floors-card"> 
    <div className="floors-card-header"> 
        <div> 
            <h2> 
                {building 
                    ? `${building.BuildingName} Floors` 
                    : "All Floors"} 
            </h2> 
            <p> 
                {filteredFloors.length} floor 
                {filteredFloors.length !== 1 
                ? "s" 
                : ""}{" "} 
                found 
            </p> 
        </div> 
        
    </div> 
    {loading ? ( 
        <div className="floor-loading"> 
            <RefreshCw 
                size={28} 
                className="floor-spin" 
            /> 
            <span>
                 Loading floors... 
            </span>
            
         </div> 
    ) : filteredFloors.length === 0 ? ( 
        <div className="floor-empty"> 
            <div className="floor-empty-icon"> 
                <Layers size={34} /> 
            </div> 
            <h3> 
                {searchTerm 
                    ? "No floors found" 
                    : "No floors yet"} 
            </h3> 
            <p> 
                    {searchTerm 
                        ? "Try another search." 
                        : "Add a floor to this building to start managing rooms."} 
            </p> 
            {!searchTerm && 
                    isAdministrator && 
                    buildingId && ( 
                        <button 
                            type="button" 
                            className="floor-empty-btn" 
                            onClick={openAddModal} 
                        > 
                            <Plus size={17} /> 
                            Add Floor 
                        </button> 
                    )} 
        </div> 
 ) : ( 
    <div className="floor-table-wrapper"> 
        <table className="floor-table"> 
            <thead> 
                <tr> 
                    <th>Floor</th> 
                    <th>Building</th> 
                    <th>Property</th> 
                    <th>Rooms</th> 
                    <th>Structure</th> 
                    {isAdministrator && ( 
                        <th>Actions</th> 
                    )} 
                </tr> 
            </thead> 
            <tbody> 
                {filteredFloors.map((floor) => ( 
                    <tr key={floor.FloorID}> 
                        <td> 
                            <div className="floor-number-cell"> 
                                <div className="floor-row-icon"> 
                                    <Layers size={19} /> 
                                </div> 
                            <div> 
                                <strong>
                                    Floor{" "} 
                                    {
                                       floor.FloorNumber 
                                    } 
                                </strong> 
                                <span> 
                                    Floor # 
                                    { 
                                    floor.FloorID
                                    } 
                                </span> 
                            </div> 
                        </div> 
                        </td> 
                        <td> 
                            <div className="floor-location-cell"> 
                                <Building2 size={16} /> 
                                <span> 
                                    { 
                                        floor.BuildingName ||
                                        building?.BuildingName || 
                                        "Unknown" 
                                    } 
                                </span> 
                            </div> 
                        </td> 
                        <td> 
                            <div className="floor-location-cell"> 
                                <Home size={16} /> 
                                <span> 
                                    { 
                                        floor.PropertyName || 
                                        building?.PropertyName || 
                                        "Unknown" 
                                    } 
                                </span> 
                            </div> 
                        </td> 
                        <td> 
                            <span className="room-count-badge"> 
                                <DoorOpen size={15} /> 
                                {Number( 
                                    floor.RoomCount || 0 
                                )} 
                            </span> 
                        </td> 
                        <td> 
                            <Link 
                                to={`/rooms?floorId=${floor.FloorID}`} 
                                className="manage-rooms-btn" 
                            > 
                                <DoorOpen size={16} /> 
                                Manage Rooms 
                            </Link> 
                        </td> 
                        {isAdministrator && ( 
                            <td> 
                                <div className="floor-actions"> 
                                    <button 
                                        type="button" 
                                        className="floor-edit-btn" 
                                        onClick={() => 
                                            openEditModal( 
                                                floor 
                                            ) 
                                        } 
                                        title="Edit floor" 
                                    > 
                                        <Pencil size={16} /> 
                                        
                                    </button> 
                                    <button 
                                        type="button" 
                                        className="floor-delete-btn" 
                                        onClick={() => 
                                            handleDelete( 
                                                floor 
                                            ) 
                                        } 
                                        disabled={ 
                                            deleteLoading === 
                                            floor.FloorID 
                                        } 
                                        title="Delete floor" 
                                    > 
                                            
                                        {deleteLoading === 
                                        floor.FloorID ? ( 
                                            <RefreshCw 
                                                size={16} 
                                                className="floor-spin" 
                                            /> 
                                        ) : ( 
                                        <Trash2 
                                            size={16} 
                                        /> 
                                    )} 
                                    </button> 
                                </div> 
                            </td> 
                        )} 
                    </tr> 
                ))} 
            </tbody> 
        </table> 
    </div> 
)} 
</div> 
{/* ========================================== 
MODAL 
========================================== */} 
{showModal && ( 
    <div 
        className="floor-modal-overlay" 
        onMouseDown={(event) => { 
            if ( 
                event.target === 
                event.currentTarget 
            ) { 
                closeModal();
            } 
        }} 
    > 
        <div className="floor-modal"> 
            <div className="floor-modal-header"> 
                <div className="floor-modal-title"> 
                    <div className="floor-modal-icon"> 
                        <Layers size={21} /> 
                    </div> 
                <div> 
                    <h2> 
                        {editingFloor 
                        ? "Edit Floor" 
                        : "Add Floor"} 
                    </h2> 
                    <p> 
                        {editingFloor 
                            ? "Update the floor number." 
                            : `Add a floor to ${ 
                                building?.BuildingName || 
                                "this building" 
                            }.`} 
                    </p> 
                    
                </div> 
            </div> 
            <button 
                type="button" 
                className="floor-modal-close" 
                onClick={closeModal} 
                disabled={saving} 
            > 
                <X size={20} /> 
            </button> 
        </div> 
        <form 
            className="floor-form" 
            onSubmit={handleSubmit} 
        > 
            {formError && ( 
                <div className="floor-form-error"> 
                    <AlertCircle size={17} /> 
                    <span>{formError}</span> 
                </div> 
            )} 
            <div className="floor-form-group"> 
                <label htmlFor="floorNumber"> 
                    Floor Number 
                    <span>*</span> 
                </label> 
                <input 
                    id="floorNumber" 
                    type="number" 
                    min="1" 
                    step="1" 
                    placeholder="e.g. 5"
                    value={floorNumber} 
                    onChange={(event) => 
                        setFloorNumber( 
                            event.target.value 
                        ) 
                    } 
                    disabled={saving} 
                    autoFocus 
                /> 
                <small> 
                    Enter a positive whole number. 
                </small> 
            </div> 
            <div className="floor-form-info"> 
                <Layers size={17} /> 
                <p> 
                    Each floor number must be unique 
                    within this building. 
                </p> 
            </div> 
            <div className="floor-modal-footer"> 
                <button 
                    type="button" 
                    className="floor-cancel-btn" 
                    onClick={closeModal} 
                    disabled={saving} 
                > 
                    Cancel 
                </button> 
                <button 
                    type="submit" 
                    className="floor-save-btn" 
                    disabled={saving} 
                > 
                    {saving ? ( 
                        <> 
                        <RefreshCw 
                            size={17} 
                            className="floor-spin" 
                        /> 
                        Saving... 
                    </> 
                ) : ( 
                <> 
                    <Plus size={17} /> {
                    editingFloor 
                        ? "Save Changes" 
                        : "Add Floor"} 
                    </> 
                )} 
            </button> 
        </div> 
    </form> 
                </div> 
            </div> 
        )}
        </div> 
    ); 
}; 
export default Floors;